"""avisos traducibles y autoevaluacion

Revision ID: 11777dcd2a1d
Revises: c4eea4c81886
Create Date: 2026-10-25 18:38:21.012513

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '11777dcd2a1d'
down_revision = 'c4eea4c81886'
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table('game_sessions', schema=None) as batch_op:
        batch_op.add_column(sa.Column('feeling', sa.String(length=16), nullable=True))

    with op.batch_alter_table('notifications', schema=None) as batch_op:
        batch_op.add_column(sa.Column('kind', sa.String(length=40), nullable=True))
        batch_op.add_column(sa.Column('params_json', sa.Text(), nullable=True))



def downgrade():
    with op.batch_alter_table('notifications', schema=None) as batch_op:
        batch_op.drop_column('params_json')
        batch_op.drop_column('kind')

    with op.batch_alter_table('game_sessions', schema=None) as batch_op:
        batch_op.drop_column('feeling')

