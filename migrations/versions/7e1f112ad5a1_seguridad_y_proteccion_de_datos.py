"""seguridad y proteccion de datos

Revision ID: 7e1f112ad5a1
Revises: 11777dcd2a1d
Create Date: 2026-10-27 14:44:01.376375

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '7e1f112ad5a1'
down_revision = '11777dcd2a1d'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table('login_throttles',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('key', sa.String(length=200), nullable=False),
    sa.Column('failures', sa.Integer(), nullable=False),
    sa.Column('window_start', sa.DateTime(), nullable=True),
    sa.Column('locked_until', sa.DateTime(), nullable=True),
    sa.PrimaryKeyConstraint('id')
    )
    with op.batch_alter_table('login_throttles', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_login_throttles_key'), ['key'], unique=True)

    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.add_column(sa.Column('data_consent_at', sa.DateTime(), nullable=True))
        batch_op.add_column(sa.Column('data_consent_by_id', sa.Integer(), nullable=True))
        batch_op.create_foreign_key('fk_users_data_consent_by_id', 'users', ['data_consent_by_id'], ['id'])


def downgrade():
    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.drop_constraint('fk_users_data_consent_by_id', type_='foreignkey')
        batch_op.drop_column('data_consent_by_id')
        batch_op.drop_column('data_consent_at')

    with op.batch_alter_table('login_throttles', schema=None) as batch_op:
        batch_op.drop_index(batch_op.f('ix_login_throttles_key'))

    op.drop_table('login_throttles')
