"""cuentas archivadas y administrador principal

Revision ID: c4eea4c81886
Revises: 411602cf1c56
Create Date: 2026-10-25 18:30:21.720400

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'c4eea4c81886'
down_revision = '411602cf1c56'
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.add_column(sa.Column('is_principal', sa.Boolean(), server_default=sa.false(), nullable=False))
        batch_op.add_column(sa.Column('archived_at', sa.DateTime(), nullable=True))
        batch_op.add_column(sa.Column('archived_by_id', sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column('created_by_id', sa.Integer(), nullable=True))
        batch_op.create_foreign_key('fk_users_archived_by_id', 'users', ['archived_by_id'], ['id'])
        batch_op.create_foreign_key('fk_users_created_by_id', 'users', ['created_by_id'], ['id'])

    # El administrador más antiguo pasa a ser el principal, para que una
    # base existente no quede sin nadie que pueda crear administradores.
    # El rol se compara como texto porque en PostgreSQL es un tipo ENUM.
    users = sa.table('users', sa.column('id', sa.Integer), sa.column('role', sa.String), sa.column('is_principal', sa.Boolean))
    conn = op.get_bind()
    first_admin = conn.execute(
        sa.select(users.c.id).where(sa.cast(users.c.role, sa.String(20)).in_(['ADMIN', 'administrador'])).order_by(users.c.id).limit(1)
    ).scalar()
    if first_admin is not None:
        conn.execute(users.update().where(users.c.id == first_admin).values(is_principal=True))


def downgrade():
    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.drop_constraint('fk_users_created_by_id', type_='foreignkey')
        batch_op.drop_constraint('fk_users_archived_by_id', type_='foreignkey')
        batch_op.drop_column('created_by_id')
        batch_op.drop_column('archived_by_id')
        batch_op.drop_column('archived_at')
        batch_op.drop_column('is_principal')
