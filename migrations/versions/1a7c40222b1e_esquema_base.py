"""esquema base

Tablas que ya existían antes de usar Alembic en el proyecto. Con esta
revisión, `flask db upgrade` crea la base completa desde cero. En una base
que ya está al día no hace nada, porque Alembic la da por aplicada.

Revision ID: 1a7c40222b1e
Revises:
Create Date: 2026-10-26 08:34:53.137405

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '1a7c40222b1e'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    op.create_table('trastornos',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('name', sa.String(length=100), nullable=False),
    sa.Column('slug', sa.String(length=100), nullable=False),
    sa.Column('description', sa.Text(), nullable=True),
    sa.Column('icon', sa.String(length=50), nullable=True),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('name'),
    sa.UniqueConstraint('slug')
    )
    op.create_table('users',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('full_name', sa.String(length=150), nullable=False),
    sa.Column('email', sa.String(length=150), nullable=False),
    sa.Column('password_hash', sa.String(length=255), nullable=False),
    sa.Column('role', sa.Enum('STUDENT', 'TEACHER', 'ADMIN', name='roleenum'), nullable=False),
    sa.Column('created_at', sa.DateTime(), nullable=True),
    sa.Column('is_active_account', sa.Boolean(), nullable=True),
    sa.PrimaryKeyConstraint('id')
    )
    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_users_email'), ['email'], unique=True)

    op.create_table('accessibility_profiles',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('user_id', sa.Integer(), nullable=False),
    sa.Column('contrast_mode', sa.Enum('NORMAL', 'ALTO_CONTRASTE', name='contrastmode'), nullable=True),
    sa.Column('font_preference', sa.Enum('ESTANDAR', 'LEGIBLE_DISLEXIA', name='fontpreference'), nullable=True),
    sa.Column('text_size_percent', sa.Integer(), nullable=True),
    sa.Column('line_spacing_percent', sa.Integer(), nullable=True),
    sa.Column('reduce_motion', sa.Boolean(), nullable=True),
    sa.Column('audio_feedback', sa.Boolean(), nullable=True),
    sa.Column('uses_lsc', sa.Boolean(), nullable=True),
    sa.Column('cognitive_support', sa.Enum('NINGUNO', 'TEA', 'TDAH', 'DISCALCULIA', 'TOD', name='cognitivesupport'), nullable=True),
    sa.Column('autonomy_level', sa.Integer(), nullable=True),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('user_id')
    )
    op.create_table('actividades',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('trastorno_id', sa.Integer(), nullable=False),
    sa.Column('title', sa.String(length=200), nullable=False),
    sa.Column('content_body', sa.Text(), nullable=True),
    sa.Column('order_index', sa.Integer(), nullable=True),
    sa.Column('estimated_minutes', sa.Integer(), nullable=True),
    sa.Column('support_image_url', sa.String(length=500), nullable=True),
    sa.Column('lsc_video_url', sa.String(length=500), nullable=True),
    sa.Column('interactive_widget', sa.Enum('NONE', 'NUMBER_LINE', 'VISUAL_BLOCKS', name='interactivewidgettype'), nullable=True),
    sa.ForeignKeyConstraint(['trastorno_id'], ['trastornos.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_table('checks_previos',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('user_id', sa.Integer(), nullable=False),
    sa.Column('trastorno_id', sa.Integer(), nullable=False),
    sa.Column('nivel_apoyo', sa.Enum('BAJO', 'MEDIO', 'ALTO', name='nivelapoyo'), nullable=True),
    sa.Column('respondido_en', sa.DateTime(), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=True),
    sa.ForeignKeyConstraint(['trastorno_id'], ['trastornos.id'], ),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('user_id', 'trastorno_id', name='uq_user_trastorno_check')
    )
    op.create_table('progress_entries',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('user_id', sa.Integer(), nullable=False),
    sa.Column('activity_date', sa.Date(), nullable=False),
    sa.Column('minutes_spent', sa.Integer(), nullable=True),
    sa.Column('points_earned', sa.Integer(), nullable=True),
    sa.Column('created_at', sa.DateTime(), nullable=True),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('user_id', 'activity_date', name='uq_user_activity_date')
    )


def downgrade():
    op.drop_table('progress_entries')
    op.drop_table('checks_previos')
    op.drop_table('actividades')
    op.drop_table('accessibility_profiles')
    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.drop_index(batch_op.f('ix_users_email'))

    op.drop_table('users')
    op.drop_table('trastornos')
